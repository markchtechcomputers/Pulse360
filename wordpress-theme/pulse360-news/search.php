<?php get_header(); ?>
<div class="p360-topline"><div class="p360-topline-inner"><span class="p360-live">Pulse360 Search</span><span class="p360-date"><?php echo esc_html( wp_date( 'l, F j, Y' ) ); ?></span><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Back to home ↗</a></div></div>
<main id="primary" class="p360-wrap p360-archive"><header class="p360-archive-header"><span class="p360-eyebrow">Find a story</span><h1><?php printf( esc_html__( 'Search results for: %s', 'pulse360-news' ), esc_html( get_search_query() ) ); ?></h1><div class="p360-search-form"><?php get_search_form(); ?></div></header>
<?php if ( have_posts() ) : ?><div class="p360-card-grid p360-archive-grid"><?php while ( have_posts() ) : the_post(); p360_post_card(); endwhile; ?></div><?php p360_pagination(); else : ?><p>No results found. Try another search term.</p><?php endif; ?></main>
<?php get_footer(); ?>
