import React from "react";
import PropTypes from "prop-types";

export default class ShareBox extends React.Component {
  render() {
    const {url, text, hashtags} = this.props;
    
    const tweetURL = "https://twitter.com/intent/tweet" +
      `?hashtags=${encodeURIComponent(hashtags)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    const openTweetURL = (ev) => {
      if (ev.button !== 0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) {
        return;
      }
      
      const width = 550;
      const height = 420;
      const x = (window.screen.width - width) / 2;
      const y = (window.screen.height - height) / 2;
      
      window.open(tweetURL, "_blank", `location,resizable,scrollbars,width=${width},height=${height},left=${x},top=${y}`);
      ev.preventDefault();
    };
    
    return <div className="share-box">
      <a className="tweet-button" href={tweetURL} onClick={openTweetURL}>Tweet</a>
    </div>;
  }
}
ShareBox.propTypes = {
  url: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  hashtags: PropTypes.string.isRequired,
};
