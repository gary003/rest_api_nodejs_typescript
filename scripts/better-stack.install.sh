## Set up of better-stack (docker images, volumes and network)

echo "----------------------" 
echo $BSKEY
echo "----------------------" 

curl -sSL https://raw.githubusercontent.com/BetterStackHQ/collector/main/install.sh | COLLECTOR_SECRET=KPiZpR18UCFLGupf1UsJDvRjkR4m61uW bash && echo "Better-slack script ended correctly"  || echo "fail launching better-slack conf , something went wrong" && exit 1

echo "End of better slack configuration"

exit 0