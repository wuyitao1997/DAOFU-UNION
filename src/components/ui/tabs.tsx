import React from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <div className="tabs">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TabsList({ children, value, onValueChange }: TabsListProps) {
  return (
    <div className="flex space-x-2 border-b mb-4">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { currentValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  currentValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({ value, children, currentValue, onValueChange }: TabsTriggerProps) {
  const isActive = value === currentValue;
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={`px-4 py-2 font-medium transition-colors ${
        isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({ value, children, ...props }: TabsContentProps & { value?: string }) {
  const currentValue = (props as any).value;
  if (value !== currentValue) return null;
  return <div className="mt-4">{children}</div>;
}
