import { PartialType } from '@nestjs/swagger';
import { CreateWorkAreaDto } from './create-work-area.dto';

export class UpdateWorkAreaDto extends PartialType(CreateWorkAreaDto) {
  // All fields from CreateWorkAreaDto are now optional for updates
}