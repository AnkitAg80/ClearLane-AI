import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-bg-void/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 bg-bg-canvas p-6 shadow-glass-strong transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        {
          'inset-y-0 right-0 h-full w-3/4 border-l border-border-strong sm:max-w-sm data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right': side === 'right',
          'inset-y-0 left-0 h-full w-3/4 border-r border-border-strong sm:max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left': side === 'left',
          'inset-x-0 top-0 h-auto border-b border-border-strong data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top': side === 'top',
          'inset-x-0 bottom-0 h-auto border-t border-border-strong data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom': side === 'bottom',
        },
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-bg-canvas transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-bg-elevated">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent };
