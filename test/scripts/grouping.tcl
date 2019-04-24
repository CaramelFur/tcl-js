set Z Albany
set Z_LABEL "The Capitol of New York is: "

puts "\n.............. examples of differences between  \" and \{"
puts "$Z_LABEL $Z"
puts {$Z_LABEL $Z}

puts "\n....... examples of differences in nesting \{ and \" "
puts "$Z_LABEL {$Z}"
puts {Who said, "What this country needs is a good $0.05 cigar!"?}

puts "\n.............. examples of escape strings"
puts {Note: no substitutions done within braces \n \r \x0a \f \v}
puts {But:
The escaped newline at the end of a\
string is replaced by a space}
