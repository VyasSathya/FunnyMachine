import { Joke } from '../types/joke';

export interface DatabaseClient {
  jokes: {
    create(data: Partial<Joke>): Promise<Joke>;
    findUnique(params: { where: { id: string } }): Promise<Joke | null>;
    findMany(params: { where: { bit_id: string } }): Promise<Joke[]>;
    update(params: { where: { id: string }; data: Partial<Joke> }): Promise<Joke>;
    delete(params: { where: { id: string } }): Promise<void>;
  };
} 