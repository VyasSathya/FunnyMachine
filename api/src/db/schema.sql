-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create bits table
CREATE TABLE IF NOT EXISTS bits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create jokes table
CREATE TABLE IF NOT EXISTS jokes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create bit_jokes junction table
CREATE TABLE IF NOT EXISTS bit_jokes (
    bit_id UUID NOT NULL REFERENCES bits(id) ON DELETE CASCADE,
    joke_id UUID NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bit_id, joke_id)
);

-- Create sets table
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create set_bits junction table
CREATE TABLE IF NOT EXISTS set_bits (
    set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    bit_id UUID NOT NULL REFERENCES bits(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (set_id, bit_id)
);

-- Create specials table
CREATE TABLE IF NOT EXISTS specials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Create special_sets junction table
CREATE TABLE IF NOT EXISTS special_sets (
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (special_id, set_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bits_user_id ON bits(user_id);
CREATE INDEX IF NOT EXISTS idx_jokes_user_id ON jokes(user_id);
CREATE INDEX IF NOT EXISTS idx_bit_jokes_bit_id ON bit_jokes(bit_id);
CREATE INDEX IF NOT EXISTS idx_bit_jokes_joke_id ON bit_jokes(joke_id);
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_set_bits_set_id ON set_bits(set_id);
CREATE INDEX IF NOT EXISTS idx_set_bits_bit_id ON set_bits(bit_id);
CREATE INDEX IF NOT EXISTS idx_specials_user_id ON specials(user_id);
CREATE INDEX IF NOT EXISTS idx_special_sets_special_id ON special_sets(special_id);
CREATE INDEX IF NOT EXISTS idx_special_sets_set_id ON special_sets(set_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bits_updated_at ON bits;
CREATE TRIGGER update_bits_updated_at
    BEFORE UPDATE ON bits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jokes_updated_at ON jokes;
CREATE TRIGGER update_jokes_updated_at
    BEFORE UPDATE ON jokes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sets_updated_at ON sets;
CREATE TRIGGER update_sets_updated_at
    BEFORE UPDATE ON sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_specials_updated_at ON specials;
CREATE TRIGGER update_specials_updated_at
    BEFORE UPDATE ON specials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle soft deletes
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_archived = TRUE;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for soft deletes
DROP TRIGGER IF EXISTS soft_delete_bits ON bits;
CREATE TRIGGER soft_delete_bits
    BEFORE DELETE ON bits
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete();

DROP TRIGGER IF EXISTS soft_delete_jokes ON jokes;
CREATE TRIGGER soft_delete_jokes
    BEFORE DELETE ON jokes
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete();

DROP TRIGGER IF EXISTS soft_delete_sets ON sets;
CREATE TRIGGER soft_delete_sets
    BEFORE DELETE ON sets
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete();

DROP TRIGGER IF EXISTS soft_delete_specials ON specials;
CREATE TRIGGER soft_delete_specials
    BEFORE DELETE ON specials
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete(); 