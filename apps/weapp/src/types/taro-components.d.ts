import type { ComponentType } from "react";

declare const component: ComponentType<Record<string, unknown>>;
export const View: typeof component;
export const Text: typeof component;
export const Button: typeof component;
export const Input: typeof component;
export const Picker: typeof component;
export const Switch: typeof component;
export const Textarea: typeof component;
