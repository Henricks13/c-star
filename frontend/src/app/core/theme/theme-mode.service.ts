import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeModeService {
  private readonly themeOverrideStorageKey = 'cstar.theme.mode.override';

  initializeTheme(): ThemeMode {
    const overrideMode = this.getStoredOverrideMode();
    const resolvedMode = overrideMode ?? this.resolveAutomaticMode();
    this.applyMode(resolvedMode);
    return resolvedMode;
  }

  setUserMode(mode: ThemeMode): void {
    this.persistOverrideMode(mode);
    this.applyMode(mode);
  }

  getCurrentMode(): ThemeMode {
    if (typeof document === 'undefined') {
      return 'light';
    }

    const current = document.documentElement.getAttribute('data-bs-theme');
    return current === 'dark' ? 'dark' : 'light';
  }

  private resolveAutomaticMode(now: Date = new Date()): ThemeMode {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const lightModeStartAt = 6 * 60 + 30;
    const lightModeEndAt = 18 * 60 + 30;
    const isLightWindow = minutes >= lightModeStartAt && minutes < lightModeEndAt;
    return isLightWindow ? 'light' : 'dark';
  }

  private getStoredOverrideMode(): ThemeMode | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.themeOverrideStorageKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  }

  private persistOverrideMode(mode: ThemeMode): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.themeOverrideStorageKey, mode);
    } catch {
      // no-op
    }
  }

  private applyMode(mode: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-bs-theme', mode);

    if (mode === 'dark') {
      document.body.classList.add('berry-dark');
    } else {
      document.body.classList.remove('berry-dark');
    }
  }
}
