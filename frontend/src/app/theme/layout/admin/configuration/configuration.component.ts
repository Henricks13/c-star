// Angular import
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Renderer2 } from '@angular/core';

// project import
import { BerryConfig } from 'src/app/app-config';
import { ThemeModeService, ThemeMode } from 'src/app/core/theme/theme-mode.service';

@Component({
  selector: 'app-configuration',
  imports: [CommonModule],
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  renderer = inject(Renderer2);
  private readonly themeModeService = inject(ThemeModeService);

  // public method
  styleSelectorToggle!: boolean; // open configuration menu
  setFontFamily!: string; // fontFamily
  themeMode: ThemeMode = 'light';

  // life cycle event
  ngOnInit(): void {
    this.fontFamily(BerryConfig.font_family);
    this.themeMode = this.themeModeService.initializeTheme();
  }

  // public method
  fontFamily(font: string) {
    this.setFontFamily = font;
    this.renderer.removeClass(document.body, 'Roboto');
    this.renderer.removeClass(document.body, 'Poppins');
    this.renderer.removeClass(document.body, 'Inter');
    this.renderer.addClass(document.body, font);
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode = mode;
    this.themeModeService.setUserMode(mode);
  }
}
