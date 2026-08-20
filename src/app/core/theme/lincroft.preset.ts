import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/** Navy + ice-blue surfaces for a clean jewelry storefront */
export const LincroftPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef6fc',
      100: '#d5ebf6',
      200: '#a8d3ec',
      300: '#74b4db',
      400: '#4d8fbf',
      500: '#2f6fa3',
      600: '#1a4d7a',
      700: '#163d62',
      800: '#12304c',
      900: '#0e243a',
      950: '#081624'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f7fbfe',
          100: '#eef6fc',
          200: '#d5ebf6',
          300: '#b4d6ea',
          400: '#7eabc8',
          500: '#4d8fbf',
          600: '#1a4d7a',
          700: '#163d62',
          800: '#12304c',
          900: '#102033',
          950: '#0e2f4d'
        },
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}'
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.800}',
          focusColor: '{primary.900}'
        },
        formField: {
          background: '{surface.0}',
          filledBackground: '{surface.50}',
          borderColor: '{surface.200}',
          hoverBorderColor: '{surface.400}'
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}'
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#d5ebf6',
          100: '#7eabc8',
          200: '#4d8fbf',
          300: '#2f6fa3',
          400: '#1a4d7a',
          500: '#163d62',
          600: '#12304c',
          700: '#12202c',
          800: '#101c28',
          900: '#0c1620',
          950: '#071824'
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '#071824',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}'
        }
      }
    }
  }
});
