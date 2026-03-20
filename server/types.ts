export interface Inspector {
  id?: number;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'inspector';
}

export interface Prisoner {
  id?: number;
  name: string;
  registration_number: string;
  cell_id: number | null;
  entry_date: string;
  crime: string;
  status: string;
  is_isolated: number;
  age?: number;
  parents?: string;
  marital_status?: string;
  photo?: string;
  is_recidivist: number;
  cell_number?: string;
  birth_date?: string;
  father_name?: string;
  mother_name?: string;
  observations?: string;
}

export interface Cell {
  id?: number;
  number: string;
  capacity: number;
  pavilion_id: number;
  block: string;
  type: string;
  status: string;
  current_occupancy?: number;
}

export interface Pavilion {
  id?: number;
  name: string;
  description: string;
  cell_count?: number;
  prisoner_count?: number;
}
