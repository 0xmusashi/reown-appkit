import type { Meta } from '@storybook/web-components'

import { html } from 'lit'

import '@nedykit/appkit-ui/src/composites/wui-ux-by-reown'
import type { WuiUxByReown } from '@nedykit/appkit-ui/wui-ux-by-reown'

type Component = Meta<WuiUxByReown>

export default {
  title: 'Composites/wui-ux-by-reown',
  args: {}
} as Component

export const Default: Component = {
  render: () => html`<wui-ux-by-reown></wui-ux-by-reown>`
}
