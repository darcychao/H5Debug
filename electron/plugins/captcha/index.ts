import { H5DebugPlugin, PluginContext } from '../services/plugin/plugin-interface';
import { TestStep } from '../services/testcase/engine';

export class CaptchaPlugin implements H5DebugPlugin {
  id = 'builtin-captcha';
  name = 'Captcha Resolver';
  version = '1.0.0';
  description = 'Built-in captcha resolver plugin. Intercepts input steps marked with {{CAPTCHA}} and provides a placeholder resolution.';
  author = 'H5Debug';

  private context: PluginContext | null = null;

  hooks = {
    onInputIntercept: async (step: TestStep, inputValue: string): Promise<string> => {
      if (inputValue.includes('{{CAPTCHA}}')) {
        // Placeholder: in production, this would call an OCR/captcha service
        const resolved = `CAPTCHA_${Date.now()}`;
        this.context?.logger.info(`Captcha resolved for step ${step.name}: ${resolved}`);
        return inputValue.replace('{{CAPTCHA}}', resolved);
      }
      return inputValue;
    },
  };

  install(context: PluginContext): void {
    this.context = context;
    context.logger.info('CaptchaPlugin installed');
  }

  uninstall(): void {
    this.context = null;
  }
}
