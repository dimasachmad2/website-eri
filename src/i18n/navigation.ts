import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Wrapper Link / router yang locale-aware (dipakai di Fase 1 untuk navigasi).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
