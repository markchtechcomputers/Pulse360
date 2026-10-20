<?php
/** Pulse360 homepage layout. */
get_header();
$featured = p360_get_posts( array( 'numberposts' => 3 ) );
$featured_ids = wp_list_pluck( $featured, 'ID' );
?>
<div class="p360-topline"><div class="p360-topline-inner"><span class="p360-live">Pulse360 Live</span><span class="p360-date"><?php echo esc_html( wp_date( 'l, F j, Y' ) ); ?></span><a href="<?php echo esc_url( home_url( '/?s=' ) ); ?>">Search stories ↗</a></div></div>
<main id="primary" class="p360-home">
<?php if ( ! empty( $featured ) ) : ?>
<section class="p360-hero-grid" aria-label="Top stories">
 <article class="p360-lead">
 <?php $lead = $featured[0]; setup_postdata( $lead ); ?>
 <?php p360_post_image( 'pulse360-lead' ); ?><?php p360_category_link(); ?>
 <h1><a href="<?php echo esc_url( get_permalink( $lead ) ); ?>"><?php echo esc_html( get_the_title( $lead ) ); ?></a></h1>
 <p class="p360-lead-excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt( $lead ), 34 ) ); ?></p><?php p360_meta(); ?>
 <?php wp_reset_postdata(); ?>
 </article>
 <div class="p360-side-stories">
 <?php foreach ( array_slice( $featured, 1 ) as $story ) : setup_postdata( $story ); ?>
 <article class="p360-side-story"><?php p360_post_image(); ?><div><?php p360_category_link(); ?><h3><a href="<?php echo esc_url( get_permalink( $story ) ); ?>"><?php echo esc_html( get_the_title( $story ) ); ?></a></h3><?php p360_meta(); ?></div></article>
 <?php endforeach; wp_reset_postdata(); ?>
 </div>
</section>
<?php else : ?><section class="p360-section"><h1>Welcome to Pulse360</h1><p>Your source for Kenyan and international news, sports, music and entertainment. Publish your first story to bring the homepage to life.</p></section><?php endif; ?>
<section class="p360-section"><div class="p360-section-heading"><h2>Latest Stories</h2><a href="<?php echo esc_url( get_post_type_archive_link( 'post' ) ?: home_url( '/' ) ); ?>">Read more</a></div><div class="p360-card-grid">
<?php $latest = new WP_Query( array( 'post_type'=>'post','posts_per_page'=>6,'post__not_in'=>$featured_ids,'ignore_sticky_posts'=>true ) ); if ( $latest->have_posts() ) : while ( $latest->have_posts() ) : $latest->the_post(); p360_post_card(); endwhile; wp_reset_postdata(); else : ?><p>More stories will appear here as you publish articles.</p><?php endif; ?>
</div></section>
<?php
$sections = array( 'news'=>'Kenya & World News', 'sports'=>'Sports', 'entertainment'=>'Music & Entertainment' );
foreach ( $sections as $slug => $heading ) :
$category = get_category_by_slug( $slug );
if ( ! $category ) { continue; }
$query = new WP_Query( array( 'post_type'=>'post','posts_per_page'=>3,'cat'=>$category->term_id,'post__not_in'=>$featured_ids,'ignore_sticky_posts'=>true ) );
if ( $query->have_posts() ) : ?>
<section class="p360-section p360-category-band"><div class="p360-section-heading"><h2><?php echo esc_html( $heading ); ?></h2><a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>">All <?php echo esc_html( $heading ); ?> →</a></div><div class="p360-card-grid"><?php while ( $query->have_posts() ) : $query->the_post(); p360_post_card(); endwhile; ?></div></section>
<?php endif; wp_reset_postdata(); endforeach; ?>
<section class="p360-newsletter"><div><h2>Stories that move you.</h2><p>Stay connected to the headlines, sports, music and culture shaping Kenya and the world.</p></div><a href="<?php echo esc_url( home_url( '/?s=' ) ); ?>">Explore the latest →</a></section>
</main>
<?php get_footer(); ?>
