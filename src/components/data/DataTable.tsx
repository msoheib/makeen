import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Box,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  idField: keyof T;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onSelectedDelete?: (selected: T[]) => void;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
}

type Order = 'asc' | 'desc';

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  idField,
  selectable = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onSelectedDelete,
  title,
  loading = false,
  emptyMessage,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [selected, setSelected] = useState<T[]>([]);

  const handleRequestSort = (property: keyof T | string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(rows);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (row: T) => {
    if (selectable) {
      const selectedIndex = selected.findIndex((item) => item[idField] === row[idField]);
      let newSelected: T[] = [];

      if (selectedIndex === -1) {
        newSelected = [...selected, row];
      } else {
        newSelected = selected.filter((item) => item[idField] !== row[idField]);
      }

      setSelected(newSelected);
    }
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (row: T) =>
    selected.findIndex((item) => item[idField] === row[idField]) !== -1;

  // Sort rows
  const sortedRows = [...rows].sort((a, b) => {
    if (orderBy === '') return 0;

    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (aValue === bValue) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });

  // Paginate rows
  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Filter columns for mobile
  const visibleColumns = isMobile
    ? columns.filter((col) => !col.hideOnMobile)
    : columns;

  const hasActions = onEdit || onDelete || onView;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      {(title || selected.length > 0) && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }),
          }}
        >
          {selected.length > 0 ? (
            <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1">
              {selected.length} {t('common.selected')}
            </Typography>
          ) : (
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
              {title}
            </Typography>
          )}

          {selected.length > 0 ? (
            onSelectedDelete && (
              <Tooltip title={t('common.delete')}>
                <IconButton onClick={() => onSelectedDelete(selected)}>
                  <DeleteIcon sx={{ color: 'inherit' }} />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Tooltip title={t('common.filter')}>
              <IconButton>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      )}

      {/* Table */}
      <TableContainer sx={{ maxHeight: { xs: 'none', sm: 600 } }}>
        <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right" style={{ minWidth: isMobile ? 80 : 120 }}>
                  {t('common.actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    {emptyMessage || t('common.noDataFound')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const isItemSelected = isSelected(row);
                return (
                  <TableRow
                    hover
                    onClick={() => handleClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={String(row[idField])}
                    selected={isItemSelected}
                    sx={{ cursor: selectable || onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={String(column.id)} align={column.align}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                    {hasActions && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {onView && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(row);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          )}
                          {onEdit && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {onDelete && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('common.rowsPerPage')}
      />
    </Paper>
  );
}
