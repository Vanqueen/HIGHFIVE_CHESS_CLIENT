import * as React from 'react';

type LabelProps = React.ComponentProps<"label"> & {
    required?: boolean;
    className?: string;
    htmlFor?: string;
    children: React.ReactNode;
    error?: boolean | string;
}

function Label({ htmlFor, children, className, required = false, ...props }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={className} {...props}>
      {children}
      {required && <span aria-hidden="true" className='text-red-900'> *</span>}
    </label>
  );
}

export default Label;