import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';

/**
 * Render a React component to a PDF buffer
 * 
 * @param Component The React component to render
 * @param props Props to pass to the component
 * @returns A Promise that resolves to PDF data
 */
export async function renderToBuffer(Component: React.ComponentType<any>, props: any): Promise<ArrayBuffer> {
  // Create the React element
  const element = createElement(Component, props);
  
  // Create the PDF document
  const document = pdf(element);
  
  // Get the blob and convert it to an ArrayBuffer
  const blob = await document.toBlob();
  return await blob.arrayBuffer();
} 