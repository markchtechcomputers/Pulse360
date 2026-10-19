<?php
/** Single article template. */
get_header();
while ( have_posts() ) : the_post();
?>
<div class="p360-topline"><div class="p360-topline-inner"><span class="p360-live">Pulse360</span><span class="p360-date"><?php echo esc_html( wp_date( 'l, F j, Y' ) ); ?></span><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Back to home ↗</a></div></div>
<main id="primary" class="site-main">
<header class="p360-article-header"><?php p360_category_link(); ?><h1><?php the_title(); ?></h1><?php if ( has_excerpt() ) : ?><p class="p360-article-deck"><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?><?php p360_meta(); ?></header>
<?php if ( has_post_thumbnail() ) : ?><div class="p360-article-hero"><?php the_post_thumbnail( 'pulse360-lead' ); ?></div><?php endif; ?>
<article <?php post_class( 'p360-article-content' ); ?>><?php the_content(); wp_link_pages(); ?></article>
</main>
<?php endwhile; get_footer(); ?>
