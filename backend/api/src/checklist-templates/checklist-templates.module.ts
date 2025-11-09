import { Module } from '@nestjs/common';
import { ChecklistTemplatesController } from './checklist-templates.controller';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChecklistTemplatesController],
  providers: [ChecklistTemplatesService],
  exports: [ChecklistTemplatesService],
})
export class ChecklistTemplatesModule {}

