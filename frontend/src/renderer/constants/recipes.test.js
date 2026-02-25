import { describe, it, expect } from 'vitest';
import {
    DEFAULT_RECIPES,
    findRecipeById,
    getRecipeDifficulty,
    getRecipeDisplayName,
    getActivityLabelWithEmoji
} from './recipes';

describe('recipes constants', () => {
    it('returns recipe by id', () => {
        const recipe = findRecipeById('tinto', DEFAULT_RECIPES);
        expect(recipe?.name).toBe('Tinto');
    });

    it('resolves difficulty from recipe ids and legacy ids', () => {
        expect(getRecipeDifficulty('macchiato', DEFAULT_RECIPES)).toBe('facil');
        expect(getRecipeDifficulty('tinto_medium_01', DEFAULT_RECIPES)).toBe('intermedio');
    });

    it('builds display labels with emoji', () => {
        expect(getRecipeDisplayName('sancocho_de_res', DEFAULT_RECIPES)).toBe('Sancocho de res');
        expect(getActivityLabelWithEmoji('tinto', DEFAULT_RECIPES)).toContain('☕');
    });
});