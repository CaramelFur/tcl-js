set X 100
set Y 256
set Z [expr {$Y + $X}]
set Z_LABEL "$Y plus $X is "

puts "$Z_LABEL $Z"
puts "The square root of $Y is [expr { sqrt($Y) }]\n"

puts "Because of the precedence rules \"5 + -3 * 4\"   is:"
puts "   [expr {-3 * 4 + 5}]"
puts "Because of the parentheses      \"(5 + -3) * 4\" is:"
puts "   [expr {(5 + -3) * 4}]"
