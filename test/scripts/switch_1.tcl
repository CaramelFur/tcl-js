# Name polygons, based on the number of edges.

set edge_count 3

switch $edge_count {
    0 -
    1 -
    2 {
        puts "Not a polygon."
    }
    3 {
        puts "This is a triangle."
    }
    4 {
        puts "This is a quadrilateral."
    }
    5 {
        puts "This is a pentagon."
    }
    default {
        puts "Unknown polygon."
    }
}