// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders the button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /Click Me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Destructive Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
    
    rerender(<Button variant="secondary">Secondary Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
    
    rerender(<Button variant="ghost">Ghost Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');
    
    rerender(<Button variant="link">Link Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');
    
    rerender(<Button size="lg">Large Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    
    rerender(<Button size="icon">Icon Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('size-9');
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    
    const linkElement = screen.getByRole('link', { name: /Link Button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
    // Should still have button styles
    expect(linkElement).toHaveClass('inline-flex');
  });
}); 