'use client';

import React, { useRef } from 'react'; // Import useRef
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({ children }) {
  // Use a ref to hold the ServerStyleSheet instance
  // This ensures the same instance is used across renders (including re-renders on the server in dev mode)
  const sheetRef = useRef(null);

  // Initialize the stylesheet only once if it hasn't been already
  if (!sheetRef.current) {
    sheetRef.current = new ServerStyleSheet();
  }

  useServerInsertedHTML(() => {
    const styles = sheetRef.current.getStyleElement();
    sheetRef.current.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') {
    // On the client side, React will hydrate. Styles are already in <head> from server.
    return <>{children}</>;
  }
  return (
    <StyleSheetManager sheet={sheetRef.current.instance}>
      {children}
    </StyleSheetManager>
  );
}