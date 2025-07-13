import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import MediaPreview from './MediaPreview'; // <-- IMPORT THE NEW COMPONENT

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './FeaturedPostsCarousel.css';

const FeaturedPostsCarousel = ({ posts }) => {
  return (
    <div className="featured-carousel-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={30}
        slidesPerView={1}
        loop={true}
        effect="fade"
        autoplay={{ delay: 7000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        className="featured-carousel"
      >
        {posts.map(post => (
          <SwiperSlide key={post._id}>
            <Link to={`/posts/${post._id}`} className="featured-slide-link">
              <div className="featured-slide-content">
                {/* --- THE FIX: Render MediaPreview as the background layer --- */}
                <div className="featured-slide-media-background">
                   <MediaPreview post={post} className="featured-slide-media" />
                </div>
                
                <div className="featured-slide-overlay">
                  <span className="featured-tag">Featured</span>
                  <h1 className="featured-slide-title">{post.title}</h1>
                  <p className="featured-slide-author">By {post.authorId?.username}</p>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default FeaturedPostsCarousel;