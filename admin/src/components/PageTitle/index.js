import React, { memo } from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

import favicon from '../../favicon.png';

const PageTitle = ({ title }) => (
  <Helmet title={"Makadi Heights CMS"} link={[{ rel: 'icon', type: 'image/png', href: favicon }]} />
);

PageTitle.propTypes = {
  title: "Makadi Heights CMS",
};

export default memo(PageTitle);
