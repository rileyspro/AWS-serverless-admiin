import { Task, TaskGuest } from '@admiin-com/ds-graphql';

import { WBFlex } from '@admiin-com/ds-web';
import { useTaskBoxContext } from '../../pages/TaskBox/TaskBox';
import PdfViewer from '../PdfViewer/PdfViewer';
import { useDocumentUrl } from '../../hooks/useDocumentUrl/useDocumentUrl';

/* eslint-disable-next-line */
export interface TaskPdfSignatureProps {
  task: Task | TaskGuest | null;
  minHeight?: any;
}

export function TaskPdfSignature({
  task,
  minHeight = { xs: '400px', sm: '630px' },
}: TaskPdfSignatureProps) {
  const context = useTaskBoxContext();
  const { pdfSignatureRef } = context ?? {};

  const documentUrl = useDocumentUrl(task);
  console.log('signutrea', documentUrl, task?.annotations);
  return (
    <WBFlex flex={1} sx={{ height: '100%' }}>
      {documentUrl && task && task.documents?.[0]?.key ? (
        <PdfViewer
          ref={pdfSignatureRef ?? null}
          annotations={task.annotations ?? ''}
          documentUrl={documentUrl}
        />
      ) : null}
    </WBFlex>
  );
}

export default TaskPdfSignature;
