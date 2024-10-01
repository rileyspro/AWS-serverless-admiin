import { WBBox } from '@admiin-com/ds-web';
import React, { useEffect } from 'react';

export interface PageSelectorProps {
  current: any;
  children: React.ReactNode;
}

const PageSelectionContext = React.createContext<any>({
  current: null,
  selected: false,
});

export function PageSelector({ current, children }: PageSelectorProps) {
  const [selected, setSelected] = React.useState<boolean>(false);

  // Use useEffect to manage side-effects like setting state based on props
  useEffect(() => {
    let isSelected = false; // Default to false
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.value === current) {
        isSelected = true; // Set local flag if condition is met
      }
    });
    setSelected(isSelected); // Update state based on local flag
  }, [current, children]); // Depend on 'current' and 'children'
  const ref = React.useRef<HTMLDivElement>(null);
  const handleScrollToTop = () => {
    if (ref.current) {
      console.log(ref.current.scrollTop);
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };
  React.useEffect(() => {
    setTimeout(() => {
      handleScrollToTop();
    }, 0); // Delay to ensure element has rendered
  }, [current]);
  return (
    <PageSelectionContext.Provider value={{ current, selected }}>
      <WBBox
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'inline-block',
          maxHeight: 'none',
        }}
      >
        {children}
      </WBBox>
    </PageSelectionContext.Provider>
  );
}

interface PageProps {
  value?: any;
  children: React.ReactNode;
}

export function Page({ value, children }: PageProps) {
  const { current, selected } = React.useContext<any>(PageSelectionContext);
  return current === value || (!value && !selected) ? children : null;
}

PageSelector.Page = Page;
export default PageSelector;
