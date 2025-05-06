import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the appropriate starting page
  // You can change this to whatever makes sense as your app's entry point
  redirect('/portal/login');
} 