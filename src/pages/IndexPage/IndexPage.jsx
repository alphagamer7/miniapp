import { Section, Cell, Image, List } from '@telegram-apps/telegram-ui';

import { Link } from '@/components/Link/Link.jsx';

import tonSvg from './ton.svg';

import './IndexPage.css';

/**
 * @returns {JSX.Element}
 */
export function IndexPage() {
  const sectionStyle = {
    backgroundColor: '#5a178b',
    color: 'white',
    borderRadius: '12px',
    margin: '8px',
    padding: '4px'
  };
  return (
    <div className="min-h-screen bg-purple-900">
         <List>
      <Section
        
        header="Features"
        footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
      >
        <Link to="/ton-connect">
          <Cell
            before={<Image src={tonSvg} style={{ backgroundColor: '#007AFF' }}/>}
            subtitle="Connect your TON wallet"
            style={{ backgroundColor: '#5a178b',color:'white' }}
          >
            TON Connect
          </Cell>
        </Link>
      </Section>
      <Section
        header="Application Launch Data"
      
        footer="These pages help developer to learn more about current launch information"
        style={{ backgroundColor: '#5a178b',color:'white' }}
      >
        <Link to="/init-data">
          <Cell subtitle="User data, chat information, technical data"    style={{ backgroundColor: '#5a178b',color:'white' }}>Init Data</Cell>
        </Link>
        <Link to="/launch-params">
          <Cell subtitle="Platform identifier, Mini Apps version, etc."    style={{ backgroundColor: '#5a178b',color:'white' }}>Launch Parameters</Cell>
        </Link>
        <Link to="/theme-params">
          <Cell subtitle="Telegram application palette information"    style={{ backgroundColor: '#5a178b',color:'white' }}>Theme Parameters</Cell>
        </Link>
        {/* <Link to="/round-list">
          <Cell subtitle="Telegram application palette information"   style={{ backgroundColor: '#5a178b',color:'white' }}>Round List</Cell>
        </Link> */}
      </Section>
    </List>
    </div>
 
  );
}
