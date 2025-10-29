// Conteúdo para: src/controllers/employee.controller.ts

import type { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';

const employeeService = new EmployeeService();

export class EmployeeController {

  /**
   * Lida com a requisição de buscar funcionário por matrícula
   */
  public async getEmployee(req: Request, res: Response): Promise<Response> {
    try {
      const { matricula } = req.params; // Pega a matrícula da URL

      if (!matricula) {
        return res.status(400).json({ message: 'Matrícula é obrigatória.' });
      }

      const employeeData = await employeeService.getEmployeeByMatricula(matricula);

      // Se o serviço retornar nulo, é 404
      if (!employeeData) {
        return res.status(404).json({ message: 'Funcionário não encontrado.' });
      }

      return res.status(200).json(employeeData);

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar funcionário.' });
    }
  }
}