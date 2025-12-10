import * as React from "react";

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
}

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export interface TableCaptionProps
  extends React.HTMLAttributes<HTMLTableCaptionElement> {
  className?: string;
}

export interface TableSearchProps {
  value: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
}

export interface TablePageSizeProps {
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
  disabled?: boolean;
}

export interface TableTab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TableTabsProps {
  tabs: TableTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface TableEnhancedConfig {
  search?: boolean;
  pagination?: boolean;
  pageSize?: boolean;
  tabs?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  tabConfig?: {
    tabs: TableTab[];
    defaultTab?: string;
  };
}
