<?php
/** Pulse360 News child theme functions. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style( 'pulse360-news-style', get_stylesheet_uri(), array( 'kadence-global' ), '1.0.0' );
}, 20 );
add_action( 'after_setup_theme', function () {
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'title-tag' );
    add_image_size( 'pulse360-card', 720, 450, true );
    add_image_size( 'pulse360-lead', 1200, 760, true );
} );
function p360_get_posts( $args = array() ) {
    return get_posts( wp_parse_args( $args, array( 'post_type' => 'post', 'post_status' => 'publish', 'numberposts' => 5, 'orderby' => 'date', 'order' => 'DESC' ) ) );
}
function p360_post_image( $size = 'pulse360-card' ) {
    if ( has_post_thumbnail() ) {
        echo '<a class="p360-card-image" href="' . esc_url( get_permalink() ) . '">';
        the_post_thumbnail( $size, array( 'loading' => 'lazy' ) );
        echo '</a>';
    } else {
        echo '<a class="p360-card-image p360-empty-image" href="' . esc_url( get_permalink() ) . '">Pulse360 News</a>';
    }
}
function p360_category_link() {
    $cats = get_the_category();
    if ( ! empty( $cats ) ) {
        echo '<a class="p360-category" href="' . esc_url( get_category_link( $cats[0]->term_id ) ) . '">' . esc_html( $cats[0]->name ) . '</a>';
    }
}
function p360_meta() {
    echo '<div class="p360-meta"><span>' . esc_html( get_the_author() ) . '</span><span>·</span><time datetime="' . esc_attr( get_the_date( DATE_W3C ) ) . '">' . esc_html( get_the_date() ) . '</time><span>·</span><span>' . esc_html( human_time_diff( get_the_time( 'U' ), current_time( 'timestamp' ) ) ) . ' ago</span></div>';
}
function p360_post_card() {
    echo '<article class="p360-story-card">';
    p360_post_image();
    p360_category_link();
    echo '<h3><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h3>';
    echo '<p>' . esc_html( wp_trim_words( get_the_excerpt(), 22 ) ) . '</p>';
    p360_meta();
    echo '</article>';
}
function p360_pagination() {
    $links = paginate_links( array( 'type' => 'array', 'prev_text' => '← Previous', 'next_text' => 'Next →' ) );
    if ( $links ) {
        echo '<nav class="p360-pagination" aria-label="Pagination">';
        foreach ( $links as $link ) { echo wp_kses_post( $link ); }
        echo '</nav>';
    }
}
