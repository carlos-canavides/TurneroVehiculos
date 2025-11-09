import { Module } from '@nestjs/common';
import { InspeccionesController } from './inspecciones.controller';
import { InspeccionesService } from './inspecciones.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DefaultRuleEvaluator } from './evaluators/default-rule-evaluator';

@Module({
  imports: [PrismaModule],
  controllers: [InspeccionesController],
  providers: [InspeccionesService, DefaultRuleEvaluator],
  exports: [InspeccionesService],
})
export class InspeccionesModule {}

