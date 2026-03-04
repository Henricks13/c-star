// Angular import
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Renderer2 } from '@angular/core';

// project import
import { BerryConfig } from 'src/app/app-config';

@Component({
  selector: 'app-configuration',
  imports: [CommonModule],
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  private readonly themeStorageKey = 'cstar.theme.mode';
  renderer = inject(Renderer2);

  // public method
  styleSelectorToggle!: boolean; // open configuration menu
  setFontFamily!: string; // fontFamily
  themeMode: 'light' | 'dark' = 'light';

  // life cycle event
  ngOnInit(): void {
    this.fontFamily(BerryConfig.font_family);

    const savedTheme = localStorage.getItem(this.themeStorageKey);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.setTheme(savedTheme);
      return;
    }

    this.setTheme('light');
  }

  // public method
  fontFamily(font: string) {
    this.setFontFamily = font;
    this.renderer.removeClass(document.body, 'Roboto');
    this.renderer.removeClass(document.body, 'Poppins');
    this.renderer.removeClass(document.body, 'Inter');
    this.renderer.addClass(document.body, font);
  }

  setTheme(mode: 'light' | 'dark'): void {
    this.themeMode = mode;
    document.documentElement.setAttribute('data-bs-theme', mode);

    if (mode === 'dark') {
      this.renderer.addClass(document.body, 'berry-dark');
    } else {
      this.renderer.removeClass(document.body, 'berry-dark');
    }

    localStorage.setItem(this.themeStorageKey, mode);
  }
}
