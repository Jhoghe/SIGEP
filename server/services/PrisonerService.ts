import { PrisonerRepository } from "../repositories/PrisonerRepository.js";
import { CellRepository } from "../repositories/CellRepository.js";
import { Prisoner } from "../types.js";

export class PrisonerService {
  private prisonerRepo: PrisonerRepository;
  private cellRepo: CellRepository;

  constructor() {
    this.prisonerRepo = new PrisonerRepository();
    this.cellRepo = new CellRepository();
  }

  async getPrisoners(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    const { data, total } = this.prisonerRepo.findPaginated(limit, offset, search);
    
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createPrisoner(prisonerData: any) {
    if (!prisonerData.cell_id) {
      throw new Error("A associação a uma cela é obrigatória.");
    }

    const cellId = parseInt(prisonerData.cell_id.toString());
    if (isNaN(cellId)) {
      throw new Error("ID da cela inválido.");
    }

    const cellInfo = this.cellRepo.getOccupancy(cellId);
    if (cellInfo && cellInfo.current_occupancy >= cellInfo.capacity) {
      throw new Error("A cela selecionada já atingiu sua capacidade máxima.");
    }

    const isIsolated = prisonerData.status === 'Isolamento' ? 1 : 0;
    const isRecidivist = prisonerData.is_recidivist ? 1 : 0;
    const age = parseInt(prisonerData.age?.toString() || "");
    
    const prisoner = { 
      ...prisonerData, 
      cell_id: cellId,
      is_isolated: isIsolated,
      is_recidivist: isRecidivist,
      age: isNaN(age) ? null : age
    };
    
    return this.prisonerRepo.create(prisoner);
  }

  async updatePrisoner(id: number, prisonerData: any) {
    // Normalize cell_id if present
    if (prisonerData.cell_id !== undefined) {
      if (prisonerData.cell_id === '' || prisonerData.cell_id === null) {
        prisonerData.cell_id = null;
      } else {
        const newCellId = parseInt(prisonerData.cell_id.toString());
        if (isNaN(newCellId)) {
          prisonerData.cell_id = null;
        } else {
          const currentPrisoner = this.prisonerRepo.findById(id);
          if (currentPrisoner && currentPrisoner.cell_id !== newCellId) {
            const cellInfo = this.cellRepo.getOccupancy(newCellId);
            if (cellInfo && cellInfo.current_occupancy >= cellInfo.capacity) {
              throw new Error("A cela de destino já atingiu sua capacidade máxima.");
            }
          }
          prisonerData.cell_id = newCellId;
        }
      }
    }

    if (prisonerData.status) {
      prisonerData.is_isolated = prisonerData.status === 'Isolamento' ? 1 : 0;
    }

    if (prisonerData.is_recidivist !== undefined) {
      prisonerData.is_recidivist = prisonerData.is_recidivist ? 1 : 0;
    }

    if (prisonerData.age !== undefined) {
      const age = parseInt(prisonerData.age?.toString() || "");
      prisonerData.age = isNaN(age) ? null : age;
    }

    this.prisonerRepo.update(id, prisonerData);
  }

  async dischargePrisoner(id: number) {
    this.prisonerRepo.update(id, {
      status: 'Liberado',
      cell_id: null,
      is_isolated: 0
    });
  }

  async deletePrisoner(id: number) {
    this.prisonerRepo.delete(id);
  }
}
