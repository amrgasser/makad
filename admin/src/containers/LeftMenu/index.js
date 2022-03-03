import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  LeftMenuLinksSection,
  LeftMenuFooter,
  LeftMenuHeader,
  LinksContainer,
} from '../../components/LeftMenu';
import Loader from './Loader';
import Wrapper from './Wrapper';
import useMenuSections from './useMenuSections';

const LeftMenu = ({ shouldUpdateStrapi, version, plugins, setUpdateMenu }) => {
  const location = useLocation();

  const {
    state: {
      isLoading,
      collectionTypesSectionLinks,
      singleTypesSectionLinks,
      generalSectionLinks,
      pluginsSectionLinks
    },
    toggleLoading,
    generateMenu,
  } = useMenuSections(plugins, shouldUpdateStrapi);

  const filteredCollectionTypeLinks = collectionTypesSectionLinks.filter(
    ({ isDisplayed }) => isDisplayed
  );
  const filteredSingleTypeLinks = singleTypesSectionLinks.filter(({ isDisplayed }) => isDisplayed);
  const homelinks = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "Home" && isDisplayed)
  const aboutlink = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "About" && isDisplayed)
  const makadilink = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "Home At Makadi Heights" && isDisplayed)
  const lifelink = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "Life In One Place" && isDisplayed)
  const medialink = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "Media Page" && isDisplayed)
  const eventlink = singleTypesSectionLinks.filter(({ label, isDisplayed }) => label === "Event Page" && isDisplayed)

  const wallslink = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "WithinOurWalls" && isDisplayed)
  const masterplan = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Master Plans" && isDisplayed)

  const makadilinks = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => (label === "Zones" || label === "Units" || label === "Unit Types") && isDisplayed)
  const lifelinks = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Amenities" && isDisplayed)
  const medialinks = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Centers" && isDisplayed)
  const eventslinks = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Events" && isDisplayed)
  const categorieslink = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Categories" && isDisplayed)
  // const payments = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Payments" && isDisplayed)
  const buildingType = filteredCollectionTypeLinks.filter(({ label, isDisplayed }) => label === "Building Types" && isDisplayed)

  makadilinks.unshift(makadilink[0])
  makadilinks.unshift(buildingType[0])
  console.log(makadilinks);
  lifelinks.unshift(lifelink[0])
  medialinks.unshift(medialink[0])
  eventslinks.unshift(eventlink[0])
  masterplan.unshift(aboutlink[0])
  // masterplan.push(payments[0])
  wallslink.push(categorieslink[0])
  // categorieslink.unshift(wallslink[0])
  // This effect is really temporary until we create the menu api
  // We need this because we need to regenerate the links when the settings are being changed
  // in the content manager configurations list
  useEffect(() => {
    setUpdateMenu(() => {
      toggleLoading();
      generateMenu();
    });
  }, []);

  return (
    <Wrapper>
      <Loader show={isLoading} />
      <LeftMenuHeader />
      <LinksContainer>
        {/* {filteredCollectionTypeLinks.length > 0 && (
          <LeftMenuLinksSection
            section="collectionType"
            name="collectionType"
            links={filteredCollectionTypeLinks}
            location={location}
            searchable
          />
        )} */}
        {/* {filteredSingleTypeLinks.length > 0 && (
          <LeftMenuLinksSection
            section="singleType"
            name="singleType"
            links={filteredSingleTypeLinks}
            location={location}
            searchable
          />
        )} */}

        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="home"
            name="home"
            links={homelinks || []}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="about"
            name="about"
            links={masterplan || []}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="makadi"
            name="makadi"
            links={makadilinks}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="life"
            name="life"
            links={lifelinks}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="media"
            name="media"
            links={medialinks}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="walls"
            name="walls"
            links={wallslink}
            location={location}
            searchable={false}
          />
        )}
        {homelinks.length > 0 && (
          <LeftMenuLinksSection
            section="event"
            name="event"
            links={eventslinks}
            location={location}
            searchable={false}
          />
        )}
        {generalSectionLinks.length > 0 && (
          <LeftMenuLinksSection
            section="general"
            name="general"
            links={generalSectionLinks}
            location={location}
            searchable={false}
          />
        )}
        {pluginsSectionLinks.length > 0 && (
          <LeftMenuLinksSection
            section="plugins"
            name="plugins"
            links={pluginsSectionLinks}
            location={location}
            searchable={false}
            emptyLinksListMessage="app.components.LeftMenuLinkContainer.noPluginsInstalled"
          />
        )}
      </LinksContainer>
      {/* <LeftMenuFooter key="footer" version={version} /> */}
    </Wrapper>
  );
};

LeftMenu.propTypes = {
  shouldUpdateStrapi: PropTypes.bool.isRequired,
  version: PropTypes.string.isRequired,
  plugins: PropTypes.object.isRequired,
  setUpdateMenu: PropTypes.func.isRequired,
};

export default memo(LeftMenu);
