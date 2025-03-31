import { query } from '../db'; // Assuming query function exists for DB interaction

// Placeholder type for the nested library item structure
// TODO: Define more accurately based on frontend needs and DB data
interface LibraryItem {
  id: string;
  type: 'special' | 'set' | 'bit' | 'joke' | 'idea';
  label: string;
  // Add other relevant fields: text, setup, punchline, versions, metadata etc.
  children?: LibraryItem[]; 
}

// --- Database Types (reflecting schema) ---
// (These might need adjustments based on exact column names/types/metadata structure)
interface DbBaseItem {
  id: string;
  label: string;
  metadata: any; // Define more strictly if possible
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface DbSpecial extends DbBaseItem { type: 'special'; }
interface DbSet extends DbBaseItem { type: 'set'; }
interface DbBit extends DbBaseItem { type: 'bit'; }
interface DbJoke {
  id: string;
  // Assuming text, setup, punchline etc. are stored in metadata or versions
  metadata: any; // Contains versions, analysis, canonicalIndex etc.
  text?: string; // Maybe store canonical text here?
  user_id: string;
  created_at: Date;
  updated_at: Date;
  type: 'joke';
}
// Add DbIdea if needed

type DbItem = DbSpecial | DbSet | DbBit | DbJoke; // | DbIdea;

interface SpecialSetLink { special_id: string; set_id: string; order_index: number; }
interface SetBitLink { set_id: string; bit_id: string; order_index: number; }
interface BitJokeLink { bit_id: string; joke_id: string; order_index: number; }

// --- API Output Type --- 
// Matches the structure expected by the frontend
interface ApiLibraryItem {
  id: string;
  type: 'special' | 'set' | 'bit' | 'joke' | 'idea';
  label: string;
  // Include other fields needed by frontend (text, setup, punchline, metadata, versions...)
  [key: string]: any; // Allow other properties
  children: ApiLibraryItem[];
}

/**
 * Fetches the entire nested library structure for a given user.
 * @param userId - The UUID of the user.
 * @returns A promise that resolves to an array of top-level LibraryItems.
 */
export const getLibraryTree = async (userId: string): Promise<ApiLibraryItem[]> => {
  console.log(`Fetching library tree for user: ${userId}`);
  
  try {
    // 1. Fetch all items for the user in parallel
    const [specialsRes, setsRes, bitsRes, jokesRes] = await Promise.all([
      query('SELECT id, label, metadata, user_id, created_at, updated_at FROM specials WHERE user_id = $1 AND is_archived = FALSE', [userId]),
      query('SELECT id, label, metadata, user_id, created_at, updated_at FROM sets WHERE user_id = $1 AND is_archived = FALSE', [userId]),
      query('SELECT id, label, metadata, user_id, created_at, updated_at FROM bits WHERE user_id = $1 AND is_archived = FALSE', [userId]),
      query('SELECT id, metadata, user_id, created_at, updated_at FROM jokes WHERE user_id = $1 AND is_archived = FALSE', [userId]), // Adjust selected joke fields as needed
      // Add query for DbIdea if needed
    ]);

    // 2. Fetch all relationships
    const [specialSetsRes, setBitsRes, bitJokesRes] = await Promise.all([
       query('SELECT ss.special_id, ss.set_id, ss.order_index FROM special_sets ss JOIN specials s ON ss.special_id = s.id WHERE s.user_id = $1', [userId]),
       query('SELECT sb.set_id, sb.bit_id, sb.order_index FROM set_bits sb JOIN sets s ON sb.set_id = s.id WHERE s.user_id = $1', [userId]),
       query('SELECT bj.bit_id, bj.joke_id, bj.order_index FROM bit_jokes bj JOIN bits b ON bj.bit_id = b.id WHERE b.user_id = $1', [userId]),
    ]);

    // 3. Combine and structure items (with explicit label for jokes)
    const allDbItems: DbItem[] = [
        ...specialsRes.rows.map(r => ({ ...r, type: 'special' })) as DbSpecial[],
        ...setsRes.rows.map(r => ({ ...r, type: 'set' })) as DbSet[],
        ...bitsRes.rows.map(r => ({ ...r, type: 'bit' })) as DbBit[],
        ...jokesRes.rows.map(r => ({
             ...r, 
             type: 'joke',
             // Ensure label is always present for the initial map insertion
             label: r.metadata?.label || `Joke ${r.id.substring(0, 6)}`, 
             text: r.metadata?.text, 
             setup: r.metadata?.setup, 
             punchline: r.metadata?.punchline,
             versions: r.metadata?.versions,
             canonicalVersionIndex: r.metadata?.canonicalVersionIndex,
             tags: r.metadata?.tags
        })) as DbJoke[],
        // Add ideas if fetched
    ];

    // Extract relationships
    const specialSetsLinks: SpecialSetLink[] = specialSetsRes.rows;
    const setBitsLinks: SetBitLink[] = setBitsRes.rows;
    const bitJokesLinks: BitJokeLink[] = bitJokesRes.rows;

    // --- Tree Reconstruction Logic ---
    const itemMap = new Map<string, ApiLibraryItem>();
    const isChildMap = new Set<string>();

    // Initialize map - ensure label is present for all types
    allDbItems.forEach(dbItem => {
        // The label is now guaranteed by the mapping above
        itemMap.set(dbItem.id, {
            ...(dbItem as any), // Use type assertion to allow spread for union type
            children: [] 
        });
    });

    // Populate children arrays based on relationships
    const relationships = [
        { links: specialSetsLinks, parentIdField: 'special_id', childIdField: 'set_id' },
        { links: setBitsLinks, parentIdField: 'set_id', childIdField: 'bit_id' },
        { links: bitJokesLinks, parentIdField: 'bit_id', childIdField: 'joke_id' },
    ];

    relationships.forEach(({ links, parentIdField, childIdField }) => {
        links.sort((a, b) => a.order_index - b.order_index); 
        links.forEach(link => {
            // Use type assertion 'as any' to bypass strict index signature check
            const parent = itemMap.get((link as any)[parentIdField]); 
            const child = itemMap.get((link as any)[childIdField]);
            if (parent && child) {
                parent.children.push(child);
                isChildMap.add(child.id); 
            } else {
                // Use type assertion 'as any' for logging too
                console.warn(`Could not find parent (${(link as any)[parentIdField]}) or child (${(link as any)[childIdField]}) for relationship`);
            }
        });
    });

    // Filter for top-level items (those not marked as children)
    const finalLibraryTree = Array.from(itemMap.values()).filter(item => !isChildMap.has(item.id));
    
    console.log(`Constructed library tree with ${finalLibraryTree.length} top-level items.`);
    return finalLibraryTree;

  } catch (error) {
    console.error('Error fetching library tree:', error);
    throw error; 
  }
};

// Maybe add functions for create/update/delete later if needed by this service 