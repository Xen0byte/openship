/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, useTheme } from "@keystone-ui/core"
import ReactSelect, { mergeStyles } from "react-select"
import { useInputTokens } from "../Fields/hooks/useInputTokens"
export { components as selectComponents } from "react-select"

const useStyles = ({ tokens, multi = false }) => {
  const { palette } = useTheme()
  const indicatorStyles = (provided, state) => ({
    ...provided,
    color: state.isFocused ? palette.neutral600 : palette.neutral500,
    ":hover": {
      color: state.isFocused ? palette.neutral800 : palette.neutral700
    }
  })
  return {
    control: (provided, state) => {
      const base = {
        ...provided,
        backgroundColor: tokens.background,
        borderColor: tokens.borderColor,
        borderRadius: tokens.borderRadius,
        borderWidth: tokens.borderWidth,
        fontSize: tokens.fontSize,
        boxShadow: tokens.shadow,
        transition: tokens.transition
      }
      const variant = state.isDisabled
        ? {
            backgroundColor: tokens.disabled.background || tokens.background,
            borderColor: tokens.disabled.borderColor || tokens.borderColor,
            boxShadow: tokens.disabled.shadow || tokens.shadow,
            color: tokens.disabled.foreground || tokens.foreground
          }
        : state.isFocused
        ? {
            backgroundColor: tokens.focus.background || tokens.background,
            borderColor: tokens.focus.borderColor || tokens.borderColor,
            boxShadow: tokens.focus.shadow || tokens.shadow,
            color: tokens.focus.foreground || tokens.foreground
          }
        : {
            ":hover": {
              backgroundColor: tokens.hover.background,
              borderColor: tokens.hover.borderColor,
              boxShadow: tokens.hover.shadow,
              color: tokens.hover.foreground
            }
          }
      return { ...provided, ...base, ...variant }
    },
    clearIndicator: indicatorStyles,
    dropdownIndicator: indicatorStyles,
    menu: provided => ({
      ...provided,
      border: `1px solid ${palette.neutral400}`,
      boxShadow: "0 4px 11px hsla(0, 0%, 0%, 0.1)",
      borderRadius: tokens.borderRadius,
      zIndex: 9999
    }),
    menuPortal: provided => ({ ...provided, zIndex: 9999 }),
    multiValue: provided => ({
      ...provided,
      backgroundColor: palette.neutral300,
      borderRadius: tokens.borderRadius
    }),
    multiValueLabel: provided => ({
      ...provided,
      // fontSize: typography.fontSize.medium,
      fontSize: "90%"
    }),
    multiValueRemove: provided => ({
      ...provided,
      borderRadius: tokens.borderRadius
    }),
    placeholder: provided => ({
      ...provided,
      color: tokens.placeholder
    }),
    valueContainer: provided => ({
      ...provided,
      padding: multi ? `0 4px` : `0 6px`
    })
  }
}

const portalTarget = typeof document !== "undefined" ? document.body : undefined

export function Select({
  id,
  onChange,
  value,
  width: widthKey = "large",
  portalMenu,
  styles,
  ...props
}) {
  const tokens = useInputTokens({ width: widthKey })
  const defaultStyles = useStyles({ tokens })
  const composedStyles = styles
    ? mergeStyles(defaultStyles, styles)
    : defaultStyles

  return (
    <ReactSelect
      inputId={id}
      value={value}
      // css={{ width: tokens.width }}
      styles={composedStyles}
      onChange={value => {
        if (!value) {
          onChange(null)
        } else {
          onChange(value)
        }
      }}
      {...props}
      isMulti={false}
      menuPortalTarget={portalMenu && portalTarget}
    />
  )
}

export function MultiSelect({
  id,
  onChange,
  value,
  width: widthKey = "large",
  portalMenu,
  styles,
  ...props
}) {
  const tokens = useInputTokens({ width: widthKey })
  const defaultStyles = useStyles({ tokens, multi: true })
  const composedStyles = styles
    ? mergeStyles(defaultStyles, styles)
    : defaultStyles

  return (
    <ReactSelect
      // css={{ width: tokens.width }}
      inputId={id}
      styles={composedStyles}
      value={value}
      onChange={value => {
        if (!value) {
          onChange([])
        } else if (Array.isArray(value)) {
          onChange(value)
        } else {
          onChange([value])
        }
      }}
      {...props}
      isMulti
      menuPortalTarget={portalMenu && portalTarget}
    />
  )
}
