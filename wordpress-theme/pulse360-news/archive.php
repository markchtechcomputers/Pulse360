<?php
/** Archive, category, tag and author listing fallback. */
get_header(); $description = get_the_archive_description(); ?>
<div class="p360-topline"><div class="p360-topline-inner"><span class="p360-live">Explore Pulse360</span><span class="p360-date"><?php echo esc_html( wp_date( 'l, F j, Y' ) ); ?></span><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Back to home ↗</a></div></div>
<main id="primary" class="p360-wrap p360-archive"><header class="p360-archive-header"><span class="p360-eyebrow">Pulse360 newsroom</span><h1><?php the_archive_title(); ?></h1><?php if ( $description ) : ?><div class="p360-archive-description"><?php echo wp_kses_post( $description ); ?></div><?php endif; ?></header>
<?php if ( have_posts() ) : ?><div class="p360-card-grid p360-archive-grid"><?php while ( have_posts() ) : the_post(); p360_post_card(); endwhile; ?></div><?php p360_pagination(); else : ?><p>No stories here yet. Check back soon for new updates.</p><?php endif; ?></main>
<?php get_footer(); ?>
