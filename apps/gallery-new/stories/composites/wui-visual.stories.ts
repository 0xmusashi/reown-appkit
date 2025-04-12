import type { Meta } from '@storybook/web-components'

import { html } from 'lit'

import '@nedykit/appkit-ui-new/src/components/wui-visual'
import type { WuiVisual } from '@nedykit/appkit-ui-new/src/components/wui-visual'

import { visualOptions } from '../../utils/PresetUtils'

type Component = Meta<WuiVisual>

export default {
  title: 'Composites/wui-visual',
  args: {
    name: 'browser'
  },
  argTypes: {
    name: {
      options: visualOptions,
      control: { type: 'select' }
    }
  }
} as Component

export const Default: Component = {
  render: args => html`<wui-visual name=${args.name}></wui-visual>`
}
