package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.dto.BenchmarkResponse;
import com.CarbonTrack.backend.repository.ActivityLogRepository;
import com.CarbonTrack.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class BenchmarkService {
    private final UserRepository users;
    private final ActivityLogRepository activities;
    public BenchmarkService(UserRepository users, ActivityLogRepository activities) {
        this.users=users; this.activities=activities;
    }

    @Transactional(readOnly = true)
    public BenchmarkResponse benchmark(String username, LocalDate start, LocalDate end) {
        if (start==null || end==null || end.isBefore(start)) throw new IllegalArgumentException("Valid date range required");
        var user=users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
        BigDecimal mine=activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(user.getId(),start,end)
                .stream().map(a -> a.getCo2eKg()==null?BigDecimal.ZERO:a.getCo2eKg()).reduce(BigDecimal.ZERO,BigDecimal::add);
        var eligible=users.findAll().stream().filter(u -> u.isGoalVisibility()).toList();
        BigDecimal sum=BigDecimal.ZERO; long count=0;
        for (var participant:eligible) {
            var total=activities.findByUserIdAndLogDateBetweenOrderByLogDateDesc(participant.getId(),start,end)
                    .stream().map(a -> a.getCo2eKg()==null?BigDecimal.ZERO:a.getCo2eKg()).reduce(BigDecimal.ZERO,BigDecimal::add);
            sum=sum.add(total); count++;
        }
        BigDecimal avg=count==0?BigDecimal.ZERO:sum.divide(BigDecimal.valueOf(count),2,RoundingMode.HALF_UP);
        String comparison=count==0?"NO_COMPARISON":mine.compareTo(avg)>0?"ABOVE_AVERAGE":mine.compareTo(avg)<0?"BELOW_AVERAGE":"AT_AVERAGE";
        return new BenchmarkResponse(mine,avg,count,comparison);
    }
}