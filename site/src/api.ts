// Generated from docs/components/*.md by tools/site-api.mjs: do not edit.
export interface ApiRow { tsx: string; rust: string; type: string; default: string; note: string }
export interface ApiName { name: string; note: string }
export interface ApiGroup {
  title: string;
  kind: "props" | "names";
  events: string;
  rows: (ApiRow | ApiName)[];
}

export const API: Record<string, ApiGroup[]> = {
  "action-sheet": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onOpenChange(open), onAction(id), onCancel().",
      "rows": [
        {
          "tsx": "`open`",
          "rust": "`.open(..)`",
          "type": "`boolean`",
          "default": "—",
          "note": "Controlled; follow `onOpenChange`"
        },
        {
          "tsx": "`defaultOpen`",
          "rust": "`.default_open(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Open at first"
        },
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "13 pt semibold, centered"
        },
        {
          "tsx": "`message`",
          "rust": "`.message(..)`",
          "type": "`string`",
          "default": "none",
          "note": "13 pt secondary label"
        },
        {
          "tsx": "`actions`",
          "rust": "`.actions(..)`",
          "type": "`SheetAction[]`",
          "default": "`[]`",
          "note": "The actions"
        },
        {
          "tsx": "`cancel`",
          "rust": "`.cancel(..)`",
          "type": "`string`",
          "default": "`\"Cancel\"`",
          "note": "`\"\"` hides it"
        }
      ]
    }
  ],
  "activity-indicator": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`size`",
          "rust": "`.size(..)`",
          "type": "`number`",
          "default": "`20`",
          "note": "The box in points; the blades scale with it"
        },
        {
          "tsx": "`color`",
          "rust": "`.color(..)`",
          "type": "token name",
          "default": "`activity-tick`",
          "note": "The blades' color (`#3C3C44` light, `#EBEBF5` dark)"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "none",
          "note": "What screen readers say: name the task, not the wait"
        },
        {
          "tsx": "`animating`",
          "rust": "`.animating(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "`false` freezes a still frame"
        }
      ]
    }
  ],
  "alert-dialog": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`open`",
          "rust": "`.open(..)`",
          "type": "`boolean`",
          "default": "—",
          "note": "Controlled; follow `onOpenChange`"
        },
        {
          "tsx": "`defaultOpen`",
          "rust": "`.default_open(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Open at first"
        },
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "17 pt semibold, centered"
        },
        {
          "tsx": "`message`",
          "rust": "`.message(..)`",
          "type": "`string`",
          "default": "none",
          "note": "13 pt, centered"
        },
        {
          "tsx": "`actions`",
          "rust": "`.actions(..)`",
          "type": "`DialogAction[]`",
          "default": "`[]`",
          "note": "Two side by side, three or more stacked"
        },
        {
          "tsx": "`input`",
          "rust": "`.input(..)`",
          "type": "`string`",
          "default": "none",
          "note": "Placeholder of the text field"
        },
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "`\"\"`",
          "note": "The field's text at first"
        }
      ]
    }
  ],
  "button": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onPress.",
      "rows": [
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The text; leave it out for an icon-only button"
        },
        {
          "tsx": "`variant`",
          "rust": "`.variant(..)`",
          "type": "`\"filled\"` | `\"tinted\"` | `\"plain\"` | `\"destructive\"`",
          "default": "`filled`",
          "note": "The look"
        },
        {
          "tsx": "`size`",
          "rust": "`.size(..)`",
          "type": "`\"large\"` | `\"medium\"` | `\"small\"`",
          "default": "`large`",
          "note": "Padding and text size"
        },
        {
          "tsx": "`icon`",
          "rust": "`.icon(..)`",
          "type": "icon name",
          "default": "none",
          "note": "An icon before the title"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Dimmed, reports nothing"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "none",
          "note": "What screen readers say, for an icon-only button"
        }
      ]
    }
  ],
  "context-menu": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onOpenChange(open), onAction(id).",
      "rows": [
        {
          "tsx": "`trigger`",
          "rust": "`.trigger(..)`",
          "type": "JSX",
          "default": "—",
          "note": "What the menu is about"
        },
        {
          "tsx": "`preview`",
          "rust": "`.preview(..)`",
          "type": "JSX",
          "default": "none",
          "note": "The lifted card, shown while open"
        },
        {
          "tsx": "`actions`",
          "rust": "`.actions(..)`",
          "type": "`ContextAction[]`",
          "default": "`[]`",
          "note": "The items"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "No menu"
        },
        {
          "tsx": "`open`",
          "rust": "`.open(..)`",
          "type": "`boolean`",
          "default": "—",
          "note": "Controlled"
        }
      ]
    }
  ],
  "date-picker": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(value) with the picked day as YYYY-MM-DD.",
      "rows": [
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`YYYY-MM-DD`",
          "default": "today",
          "note": "Controlled"
        },
        {
          "tsx": "`defaultValue`",
          "rust": "`.default_value(..)`",
          "type": "`YYYY-MM-DD`",
          "default": "today",
          "note": "At first"
        },
        {
          "tsx": "`variant`",
          "rust": "`.variant(..)`",
          "type": "`\"inline\" | \"compact\" | \"wheel\"`",
          "default": "`\"inline\"`",
          "note": "The look"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "`\"Date\"`",
          "note": "What screen readers call it"
        }
      ]
    }
  ],
  "icon": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`name`",
          "rust": "`.name(..)`",
          "type": "string",
          "default": "none",
          "note": "A name from the table below"
        },
        {
          "tsx": "`size`",
          "rust": "`.size(..)`",
          "type": "number",
          "default": "20",
          "note": "Its side in points"
        },
        {
          "tsx": "`tint`",
          "rust": "`.tint(..)`",
          "type": "token name",
          "default": "`label`",
          "note": "`secondary-label`, `system-blue`, `system-red`, ..."
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "string",
          "default": "none",
          "note": "What screen readers say; leave it out beside text that already names it"
        }
      ]
    },
    {
      "title": "Names",
      "kind": "names",
      "events": "",
      "rows": [
        {
          "name": "`chevron.left`, `chevron.right`, `chevron.up`, `chevron.down`",
          "note": "Navigation"
        },
        {
          "name": "`checkmark`, `checkmark.circle`",
          "note": "A chosen row, a finished job"
        },
        {
          "name": "`xmark`, `xmark.circle.fill`, `ellipsis`, `plus`",
          "note": "Clear, close, more, add"
        },
        {
          "name": "`magnifyingglass`",
          "note": "Search"
        },
        {
          "name": "`eye`, `eye.slash`",
          "note": "Reveal a password"
        },
        {
          "name": "`person`, `person.crop.circle`, `bell`, `envelope`, `envelope.open`",
          "note": "People, notifications, mail"
        },
        {
          "name": "`tray`, `paperplane`, `archivebox`, `trash`, `flag`, `flag.fill`, `paperclip`",
          "note": "Inbox, send, archive, delete, flag, attachments"
        },
        {
          "name": "`folder`, `square.and.pencil`, `pencil`, `clock`, `calendar`",
          "note": "Mailboxes, compose, edit, schedules"
        },
        {
          "name": "`arrow.clockwise`, `arrowshape.turn.up.left`, `arrowshape.turn.up.right`, `arrow.up.right`",
          "note": "Refresh, reply, forward, open"
        },
        {
          "name": "`link`, `key`, `line.3.horizontal.decrease`",
          "note": "Links, keys, filters and rules"
        },
        {
          "name": "`sun.max`, `moon`, `cloud`, `circle.lefthalf.filled`",
          "note": "Appearance and state"
        },
        {
          "name": "`square.grid.2x2`, `list.bullet`, `slider.horizontal.3`",
          "note": "Sections and settings"
        },
        {
          "name": "`info.circle`, `sparkles`, `exclamationmark.triangle`",
          "note": "Notes, highlights, failures"
        },
        {
          "name": "`doc`, `photo`",
          "note": "Files and images"
        }
      ]
    }
  ],
  "list": [
    {
      "title": "List",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The sections"
        },
        {
          "tsx": "`background`",
          "rust": "`.background(..)`",
          "type": "token name",
          "default": "`system-grouped-background`",
          "note": "Behind the sections"
        },
        {
          "tsx": "`scroll`",
          "rust": "`.scroll(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "`false` inside `NavPage`, whose scroll already runs the page"
        }
      ]
    },
    {
      "title": "Section",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`header`",
          "rust": "`.header(..)`",
          "type": "`string`",
          "default": "none",
          "note": "20 pt bold, 16 pt above, 6 pt below"
        },
        {
          "tsx": "`footer`",
          "rust": "`.footer(..)`",
          "type": "`string`",
          "default": "none",
          "note": "13 pt in the header/footer color, 10 pt below"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The rows"
        }
      ]
    },
    {
      "title": "ListTile",
      "kind": "props",
      "events": "onPress.",
      "rows": [
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The row's title, 17 pt"
        },
        {
          "tsx": "`subtitle`",
          "rust": "`.subtitle(..)`",
          "type": "`string`",
          "default": "none",
          "note": "A line under the title, 12 pt secondary label, 3 pt below it"
        },
        {
          "tsx": "`leading`",
          "rust": "`.leading(..)`",
          "type": "icon name",
          "default": "none",
          "note": "A 28 pt box with a 22 pt icon"
        },
        {
          "tsx": "`leadingColor`",
          "rust": "`.leading_color(..)`",
          "type": "token name",
          "default": "`system-blue`",
          "note": "The icon's color"
        },
        {
          "tsx": "`accessory`",
          "rust": "`.accessory(..)`",
          "type": "`\"chevron\"` | `\"checkmark\"` | `\"none\"`",
          "default": "chevron",
          "note": "At the trailing edge"
        },
        {
          "tsx": "`checked`",
          "rust": "`.checked(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Shows a checkmark and sets the row's state"
        },
        {
          "tsx": "`destructive`",
          "rust": "`.destructive(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Red title"
        },
        {
          "tsx": "`separator`",
          "rust": "`.separator(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "The hairline under the row"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Dimmed, not pressable"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "none",
          "note": "A control at the trailing edge: `<ListTile title=\"Wi-Fi\"><Switch/></ListTile>`"
        }
      ]
    }
  ],
  "navigation-bar": [
    {
      "title": "NavPage",
      "kind": "props",
      "events": "onBack, onTrailing, onRefresh.",
      "rows": [
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The bar's title; the compact one when there is a `largeTitle`"
        },
        {
          "tsx": "`largeTitle`",
          "rust": "`.large_title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "34 pt bold heading that scrolls away"
        },
        {
          "tsx": "`back`",
          "rust": "`.back(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The back button's label; without it there is no back button"
        },
        {
          "tsx": "`trailing`",
          "rust": "`.trailing(..)`",
          "type": "`string`",
          "default": "none",
          "note": "A tinted trailing action (\"Done\", \"Edit\")"
        },
        {
          "tsx": "`background`",
          "rust": "`.background(..)`",
          "type": "token name",
          "default": "`system-grouped-background`",
          "note": "The page's background"
        },
        {
          "tsx": "`material`",
          "rust": "`.material(..)`",
          "type": "`\"opaque\"` | `\"regular\"` | `\"thin\"` | `\"ultra-thin\"` | `\"thick\"` | `\"chrome\"`",
          "default": "`opaque`",
          "note": "A material floats the bar over the content, which scrolls under its blur"
        },
        {
          "tsx": "`refreshing`",
          "rust": "`.refreshing(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "A pull to refresh runs: the indicator stays below the bar"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The page's content"
        }
      ]
    },
    {
      "title": "NavigationBar",
      "kind": "props",
      "events": "onBack.",
      "rows": [
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The compact title"
        },
        {
          "tsx": "`largeTitle`",
          "rust": "`.large_title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "A large title below the bar"
        },
        {
          "tsx": "`back`",
          "rust": "`.back(..)`",
          "type": "`string`",
          "default": "none",
          "note": "Back button label"
        },
        {
          "tsx": "`trailing`",
          "rust": "`.trailing(..)`",
          "type": "JSX",
          "default": "none",
          "note": "Anything at the trailing edge"
        },
        {
          "tsx": "`collapsed`",
          "rust": "`.collapsed(..)`",
          "type": "`number` 0–1",
          "default": "`0`",
          "note": "Fades the compact title and the hairline in"
        },
        {
          "tsx": "`material`",
          "rust": "`.material(..)`",
          "type": "material name",
          "default": "`opaque`",
          "note": "A translucent bar over a blur, for content that scrolls under it"
        }
      ]
    }
  ],
  "picker": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(value, index).",
      "rows": [
        {
          "tsx": "`items`",
          "rust": "`.items(..)`",
          "type": "`PickerItem[]`",
          "default": "`[]`",
          "note": "The values, top to bottom"
        },
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "first",
          "note": "The chosen value, controlled"
        },
        {
          "tsx": "`itemHeight`",
          "rust": "`.item_height(..)`",
          "type": "`number`",
          "default": "`32`",
          "note": "Row height in points"
        },
        {
          "tsx": "`height`",
          "rust": "`.height(..)`",
          "type": "`number`",
          "default": "`216`",
          "note": "Wheel height"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "`\"Picker\"`",
          "note": "What screen readers call it"
        }
      ]
    }
  ],
  "refresh": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onRefresh().",
      "rows": [
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The scrolling content"
        },
        {
          "tsx": "`refreshing`",
          "rust": "`.refreshing(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "A refresh runs"
        },
        {
          "tsx": "`background`",
          "rust": "`.background(..)`",
          "type": "token name",
          "default": "`system-grouped-background`",
          "note": "Behind the content"
        },
        {
          "tsx": "`tint`",
          "rust": "`.tint(..)`",
          "type": "token name",
          "default": "`tertiary-label`",
          "note": "The indicator's color"
        }
      ]
    }
  ],
  "scroll-view": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The content"
        },
        {
          "tsx": "`horizontal`",
          "rust": "`.horizontal(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Scrolls sideways"
        },
        {
          "tsx": "`bounces`",
          "rust": "`.bounces(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "Overscroll and spring back"
        },
        {
          "tsx": "`indicator`",
          "rust": "`.indicator(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "The platform's indicator"
        },
        {
          "tsx": "`keyboardDismiss`",
          "rust": "`.keyboard_dismiss(..)`",
          "type": "`\"none\"` | `\"on-drag\"` | `\"interactive\"`",
          "default": "`interactive`",
          "note": "Whether a drag dismisses the keyboard"
        }
      ]
    }
  ],
  "search-field": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(text), onSubmit(text), onCancel.",
      "rows": [
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "`\"\"`",
          "note": "The text; the app owns it"
        },
        {
          "tsx": "`placeholder`",
          "rust": "`.placeholder(..)`",
          "type": "`string`",
          "default": "`\"Search\"`",
          "note": "Shown while empty"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "none",
          "note": "What screen readers call the field"
        },
        {
          "tsx": "`cancel`",
          "rust": "`.cancel(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "A Cancel button while the field is focused"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "none",
          "note": "A row under the field (scopes arrive in wave B)"
        }
      ]
    }
  ],
  "segmented-control": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(value, index).",
      "rows": [
        {
          "tsx": "`items`",
          "rust": "`.items(..)`",
          "type": "`SegmentItem[]`",
          "default": "`[]`",
          "note": "Two to five, in order"
        },
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "first",
          "note": "Chosen value, controlled"
        },
        {
          "tsx": "`defaultValue`",
          "rust": "`.default_value(..)`",
          "type": "`string`",
          "default": "first",
          "note": "At first"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "`\"Segments\"`",
          "note": "The group's name"
        }
      ]
    }
  ],
  "sheet": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onOpenChange(open), onDetentChange(detent), onCancel(), onLeading(), onTrailing().",
      "rows": [
        {
          "tsx": "`open`",
          "rust": "`.open(..)`",
          "type": "`boolean`",
          "default": "—",
          "note": "Controlled; follow `onOpenChange`"
        },
        {
          "tsx": "`defaultOpen`",
          "rust": "`.default_open(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Open at first, uncontrolled"
        },
        {
          "tsx": "`detent`",
          "rust": "`.detent(..)`",
          "type": "`\"medium\" | \"large\"`",
          "default": "none",
          "note": "Controlled detent"
        },
        {
          "tsx": "`defaultDetent`",
          "rust": "`.default_detent(..)`",
          "type": "`\"medium\" | \"large\"`",
          "default": "`\"large\"`",
          "note": "Detent at first"
        },
        {
          "tsx": "`title`",
          "rust": "`.title(..)`",
          "type": "`string`",
          "default": "none",
          "note": "17 pt semibold in the header"
        },
        {
          "tsx": "`leading`",
          "rust": "`.leading(..)`",
          "type": "`string`",
          "default": "none",
          "note": "\"Cancel\", in the tint"
        },
        {
          "tsx": "`trailing`",
          "rust": "`.trailing(..)`",
          "type": "`string`",
          "default": "none",
          "note": "\"Done\", in the tint"
        },
        {
          "tsx": "`scroll`",
          "rust": "`.scroll(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "`false` for content that scrolls itself (a page, a stack)"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The content"
        }
      ]
    }
  ],
  "slider": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(value), onChangeEnd(value).",
      "rows": [
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`number`",
          "default": "—",
          "note": "Controlled"
        },
        {
          "tsx": "`defaultValue`",
          "rust": "`.default_value(..)`",
          "type": "`number`",
          "default": "`min`",
          "note": "At first"
        },
        {
          "tsx": "`min`",
          "rust": "`.min(..)`",
          "type": "`number`",
          "default": "`0`",
          "note": "The smallest"
        },
        {
          "tsx": "`max`",
          "rust": "`.max(..)`",
          "type": "`number`",
          "default": "`1`",
          "note": "The largest"
        },
        {
          "tsx": "`step`",
          "rust": "`.step(..)`",
          "type": "`number`",
          "default": "`0.05`",
          "note": "The step values snap to; `0` for any"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Dimmed, not draggable"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "`\"Slider\"`",
          "note": "What screen readers call it"
        }
      ]
    }
  ],
  "swipe-actions": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onAction(id, full).",
      "rows": [
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The row, usually a `ListTile`"
        },
        {
          "tsx": "`leading`",
          "rust": "`.leading(..)`",
          "type": "`SwipeAction[]`",
          "default": "`[]`",
          "note": "Revealed by swiping right"
        },
        {
          "tsx": "`trailing`",
          "rust": "`.trailing(..)`",
          "type": "`SwipeAction[]`",
          "default": "`[]`",
          "note": "Revealed by swiping left"
        },
        {
          "tsx": "`fullSwipe`",
          "rust": "`.full_swipe(..)`",
          "type": "`string`",
          "default": "none",
          "note": "The action id a full swipe fires"
        }
      ]
    }
  ],
  "switch": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(checked).",
      "rows": [
        {
          "tsx": "`checked`",
          "rust": "`.checked(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "On or off; the app owns it"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Dimmed, not pressable"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "none",
          "note": "What screen readers say"
        }
      ]
    }
  ],
  "tab-bar": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`items`",
          "rust": "`.items(..)`",
          "type": "`TabItem[]`",
          "default": "`[]`",
          "note": "The tabs, in order"
        },
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "first",
          "note": "Chosen value, controlled"
        },
        {
          "tsx": "`defaultValue`",
          "rust": "`.default_value(..)`",
          "type": "`string`",
          "default": "first",
          "note": "At first"
        },
        {
          "tsx": "`blur`",
          "rust": "`.blur(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "The material behind it"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "`\"Tabs\"`",
          "note": "The bar's name"
        }
      ]
    }
  ],
  "text-field": [
    {
      "title": "Props",
      "kind": "props",
      "events": "onChange(text), onSubmit(text).",
      "rows": [
        {
          "tsx": "`value`",
          "rust": "`.value(..)`",
          "type": "`string`",
          "default": "`\"\"`",
          "note": "The text; the app owns it"
        },
        {
          "tsx": "`placeholder`",
          "rust": "`.placeholder(..)`",
          "type": "`string`",
          "default": "none",
          "note": "Shown while empty"
        },
        {
          "tsx": "`secure`",
          "rust": "`.secure(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Hides the text, with an eye button"
        },
        {
          "tsx": "`clear`",
          "rust": "`.clear(..)`",
          "type": "`boolean`",
          "default": "`true`",
          "note": "A clear button while focused and non-empty"
        },
        {
          "tsx": "`leading`",
          "rust": "`.leading(..)`",
          "type": "icon name",
          "default": "none",
          "note": "An icon before the text"
        },
        {
          "tsx": "`label`",
          "rust": "`.label(..)`",
          "type": "`string`",
          "default": "none",
          "note": "What screen readers call the field"
        },
        {
          "tsx": "`keyboard`",
          "rust": "`.keyboard(..)`",
          "type": "`\"default\"` | `\"email\"` | `\"number\"` | `\"phone\"` | `\"url\"`",
          "default": "`default`",
          "note": "The software keyboard"
        },
        {
          "tsx": "`returnKey`",
          "rust": "`.return_key(..)`",
          "type": "`\"done\"` | `\"go\"` | `\"next\"` | `\"search\"` | `\"send\"`",
          "default": "`default`",
          "note": "The return key's label"
        },
        {
          "tsx": "`disabled`",
          "rust": "`.disabled(..)`",
          "type": "`boolean`",
          "default": "`false`",
          "note": "Read-only, on the disabled fill, with a grey placeholder"
        },
        {
          "tsx": "`variant`",
          "rust": "`.variant(..)`",
          "type": "`\"rounded\"` | `\"grouped\"`",
          "default": "`rounded`",
          "note": "`CupertinoTextField`'s box or a form row's surface"
        }
      ]
    }
  ],
  "theme": [
    {
      "title": "Props",
      "kind": "props",
      "events": "",
      "rows": [
        {
          "tsx": "`contrast`",
          "rust": "`.contrast(..)`",
          "type": "`\"normal\"` | `\"high\"`",
          "default": "`normal`",
          "note": "The contrast set"
        },
        {
          "tsx": "`children`",
          "rust": "`.child(..)`",
          "type": "JSX",
          "default": "—",
          "note": "The app"
        }
      ]
    }
  ]
};
