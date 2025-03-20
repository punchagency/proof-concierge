import { FilterParams, GeneralQuery, ResolvedQuery, TransferredQuery } from '@/lib/api/donor-queries';

// Define a custom Window interface that includes our handler functions
export interface CustomWindow extends Window {
  handleFilteredGeneralQueries?: (data: GeneralQuery[]) => void;
  handleFilteredTransferredQueries?: (data: TransferredQuery[]) => void;
  handleFilteredResolvedQueries?: (data: ResolvedQuery[]) => void;
  __currentGeneralFilters?: FilterParams;
  __currentTransferredFilters?: FilterParams;
  __currentResolvedFilters?: FilterParams;
} 