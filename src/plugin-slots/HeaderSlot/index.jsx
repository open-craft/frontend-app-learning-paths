import { PluginSlot } from '@openedx/frontend-plugin-framework';
import Header from '@edx/frontend-component-header';

const HeaderSlot = () => (
  <PluginSlot
    id="org.openedx.frontend.layout.header_learning.v1"
    idAliases={['header_slot']}
    slotOptions={{ mergeProps: true }}
  >
    <Header />
  </PluginSlot>
);

export default HeaderSlot;
