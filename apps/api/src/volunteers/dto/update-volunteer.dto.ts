import { PartialType } from '@nestjs/swagger';
import { CreateVolunteerDto } from './create-volunteer.dto';

export class UpdateVolunteerDto extends PartialType(CreateVolunteerDto) {
  // All fields from CreateVolunteerDto are now optional for updates
}