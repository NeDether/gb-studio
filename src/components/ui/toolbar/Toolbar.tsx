import React, { ReactNode } from "react";
import { StyledToolbar, StyledToolbarTitle } from "ui/toolbar/style";

interface ToolbarProps {
  readonly children?: ReactNode;
  readonly focus?: boolean;
}

export const Toolbar = ({ children, focus }: ToolbarProps) => {
  return <StyledToolbar $focus={focus} children={children} />;
};

interface ToolbarTitleProps {
  readonly children?: ReactNode;
}

export const ToolbarTitle = ({ children }: ToolbarTitleProps) => {
  return <StyledToolbarTitle children={children} />;
};
