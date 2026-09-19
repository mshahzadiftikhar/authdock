/** Every default component accepts this — restyle without forking the package. */
export interface AuthFormClassNames {
  form?: string;
  field?: string;
  label?: string;
  input?: string;
  button?: string;
  error?: string;
}

export function cx(base: string, override?: string): string {
  return override ? `${base} ${override}` : base;
}
