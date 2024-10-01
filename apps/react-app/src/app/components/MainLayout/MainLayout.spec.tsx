import { render } from '@testing-library/react';

import MainLayout from './MainLayout';

describe('MainLayout', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<MainLayout />);
    expect(baseElement).toBeTruthy();
  });
});
