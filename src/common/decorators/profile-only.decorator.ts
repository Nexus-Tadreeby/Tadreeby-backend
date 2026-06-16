import { SetMetadata } from '@nestjs/common';

export const PROFILE_ONLY_KEY = 'profileOnly';

export const ProfileOnly = () =>
    SetMetadata(PROFILE_ONLY_KEY, true);